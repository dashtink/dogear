import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface BookCardProps {
  book: {
    id: number;
    title: string;
    author?: string | null;
    coverUrl?: string | null;
    year?: number | null;
    genre?: string | null;
    location?: { shelf?: { name: string } | null } | null;
    checkouts?: { returnedAt: Date | string | null }[];
  };
}

export function BookCard({ book }: BookCardProps) {
  const onLoan = book.checkouts?.some(c => !c.returnedAt);

  return (
    <Link href={`/books/${book.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="relative aspect-[2/3] bg-muted">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {onLoan && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                On Loan
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="font-semibold text-sm leading-tight line-clamp-2">{book.title}</p>
          {book.author && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
          )}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {book.year && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">{book.year}</Badge>
            )}
            {book.location?.shelf && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 max-w-[100px] truncate">
                {book.location.shelf.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
